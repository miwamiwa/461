using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class charHandler : MonoBehaviour
{
    string txt = "";
    TMP_Text tm;
    public float w = 1.5f;
    public float h = 1.0f;
    Vector2 bounds;

    float wTar = 1.5f;
    float deltaW = 0.03f;

    float fSize = 25f;
    float fSizeTar = 25f;
    float deltaFSize = 0.6f;
    

    // Start is called before the first frame update
    void Start()
    {
        tm = gameObject.GetComponent<TMP_Text>();
        updateSize(25f);
    }

    // Update is called once per frame
    void Update()
    {
        // updateSize(1f);

        bounds = tm.GetRenderedValues();

        if (Mathf.Abs(bounds.x) < 100f) wTar = bounds.x/2;
        else wTar = 1f;

        if (Mathf.Abs(bounds.y) < 100f) h = bounds.y;
        else h = 2f;

        float moreW = w + deltaW;
        
        if (moreW < wTar) w = moreW;
        else
        {
            float lessW = w - deltaW;
            if (lessW > wTar) w = lessW;
        }
        // Debug.Log("w: " + w + ", h: " + h);

        float moreS = fSize + deltaFSize;


        if (moreS < fSizeTar)
        {
            fSize = moreS;
            tm.fontSize = fSize;
        }
        else
        {
            float lessS = fSize - deltaFSize;
            if (lessS > fSizeTar)
            {
                fSize = lessS;
                tm.fontSize = fSize;
            }
        }

    }

    public void updatecolor(Material mat)
    {
        tm.color = mat.color;
    }

    public void updateSize(float size)
    {
        fSizeTar = size;
        
    }

    public void setText(string text)
    {
        tm = gameObject.GetComponent<TMP_Text>();
        tm.text = text;
    }
}
