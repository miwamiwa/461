using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class fadeinfadeout : MonoBehaviour
{
    public GameObject pic1;
    public GameObject pic2;
    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        Material mat = pic1.GetComponent<MeshRenderer>().material;
        mat.color = new Color(mat.color.r, mat.color.g, mat.color.b, mat.color.a - 0.01f);
    }
}
